docker build -t souravdeveloper/ecom-mfe-host ./host
docker build -t souravdeveloper/ecom-mfe-user ./user
docker build -t souravdeveloper/ecom-mfe-dashboard ./dashboard
docker build -t souravdeveloper/ecom-mfe-shared ./shared

docker push souravdeveloper/ecom-mfe-host
docker push souravdeveloper/ecom-mfe-user
docker push souravdeveloper/ecom-mfe-dashboard
docker push souravdeveloper/ecom-mfe-shared